using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;
using System.Linq;
using System.Threading.Tasks;
using ProjectManagementApp.API.Services;
using Microsoft.AspNetCore.Identity;

namespace ProjectManagementApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly NotificationService _notificationService;
        public TasksController(ApplicationDbContext context, EmailService emailService, UserManager<ApplicationUser> userManager, NotificationService notificationService)
        {
            _context = context;
            _emailService = emailService;
            _userManager = userManager;
            _notificationService = notificationService;
        }

        // GET: api/tasks
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetTasks()
        {
            var tasks = await _context.Tasks.Include(t => t.Project).ToListAsync();
            return Ok(tasks);
        }

        // GET: api/tasks/5
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(int id)
        {
            var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        // POST: api/tasks
        [Authorize(Roles = "TeamLead")]
        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskItem task)
        {
            // Enforce dependencies: all dependencies must be Done
            if (task.Dependencies != null && task.Dependencies.Any())
            {
                var incompleteDeps = task.Dependencies
                    .Select(d => _context.Tasks.FirstOrDefault(t => t.Id == d.DependsOnTaskId))
                    .Where(depTask => depTask == null || depTask.Status != "Done")
                    .ToList();
                if (incompleteDeps.Any())
                    return BadRequest("All dependencies must be completed (Done) before assigning this task.");
            }
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // System notification for assignment
            if (!string.IsNullOrEmpty(task.AssignedToId))
            {
                await _notificationService.NotifyAsync(task.AssignedToId, $"You have been assigned a new task: {task.Title}");
                var user = await _userManager.FindByIdAsync(task.AssignedToId);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    await _emailService.SendEmailAsync(user.Email, "New Task Assigned", $"You have been assigned a new task: {task.Title}");
                }
            }

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
        }

        // PUT: api/tasks/5
        [Authorize(Roles = "TeamLead,Employee")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem task)
        {
            if (id != task.Id) return BadRequest();
            // Enforce dependencies: all dependencies must be Done
            if (task.Dependencies != null && task.Dependencies.Any())
            {
                var incompleteDeps = task.Dependencies
                    .Select(d => _context.Tasks.FirstOrDefault(t => t.Id == d.DependsOnTaskId))
                    .Where(depTask => depTask == null || depTask.Status != "Done")
                    .ToList();
                if (incompleteDeps.Any())
                    return BadRequest("All dependencies must be completed (Done) before updating this task.");
            }
            _context.Entry(task).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/tasks/5
        [Authorize(Roles = "TeamLead")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/tasks/5/status
        [Authorize(Roles = "TeamLead,Employee")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] TaskStatusUpdateModel model)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

            // Allowed transitions
            var allowed = (task.Status, model.NewStatus) switch
            {
                ("ToDo", "InProgress") => true,
                ("InProgress", "Review") => true,
                ("Review", "Done") => true,
                ("Review", "Rejected") => true,
                ("Rejected", "InProgress") => true,
                _ => false
            };
            if (!allowed) return BadRequest("Invalid status transition");

            // Log history
            var userId = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            _context.TaskHistories.Add(new TaskHistory
            {
                TaskItemId = id,
                Status = model.NewStatus,
                Comment = model.Comment,
                Timestamp = DateTime.UtcNow,
                ChangedById = userId
            });

            // System notification for review or rejection
            if (model.NewStatus == "Review")
            {
                // Notify manager and teamlead
                var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == task.ProjectId);
                if (project != null)
                {
                    var notifyIds = project.Members.Where(m => m.Role == "Manager" || m.Role == "TeamLead").Select(m => m.UserId).Distinct();
                    foreach (var notifyId in notifyIds)
                    {
                        await _notificationService.NotifyAsync(notifyId, $"Task '{task.Title}' is set for review.");
                    }
                }
            }
            if (model.NewStatus == "Rejected")
            {
                // Notify employee
                if (!string.IsNullOrEmpty(task.AssignedToId))
                {
                    await _notificationService.NotifyAsync(task.AssignedToId, $"Your task '{task.Title}' was rejected. Please review the feedback and update.");
                }
            }

            task.Status = model.NewStatus;
            await _context.SaveChangesAsync();
            return Ok(task);
        }

        // POST: api/tasks/escalate-stuck
        [Authorize(Roles = "Manager,TeamLead")]
        [HttpPost("escalate-stuck")]
        public async Task<IActionResult> EscalateStuckTasks()
        {
            var threshold = DateTime.UtcNow.AddDays(-5);
            var stuckTasks = await _context.Tasks
                .Where(t => (t.Status == "Review" || t.Status == "Rejected") &&
                            _context.TaskHistories.Any(h => h.TaskItemId == t.Id && h.Status == t.Status && h.Timestamp <= threshold))
                .ToListAsync();
            foreach (var task in stuckTasks)
            {
                // Find manager and teamlead for the project
                var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == task.ProjectId);
                if (project == null) continue;
                var managerIds = project.Members.Where(m => m.Role == "Manager").Select(m => m.UserId).ToList();
                var teamLeadIds = project.Members.Where(m => m.Role == "TeamLead").Select(m => m.UserId).ToList();
                var notifyIds = managerIds.Concat(teamLeadIds).Distinct();
                foreach (var userId in notifyIds)
                {
                    _context.Notifications.Add(new Notification
                    {
                        UserId = userId,
                        Message = $"Task '{task.Title}' has been stuck in '{task.Status}' for over 5 days.",
                        Type = "System",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Escalated {stuckTasks.Count} stuck tasks." });
        }

        // POST: api/tasks/{taskId}/log
        [Authorize(Roles = "Employee")]
        [HttpPost("{taskId}/log")]
        public async Task<IActionResult> LogTime(int taskId, [FromBody] TaskLogModel model)
        {
            var userId = _userManager.GetUserId(User);
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null) return NotFound();
            _context.TaskHistories.Add(new TaskHistory
            {
                TaskItemId = taskId,
                Status = task.Status,
                Comment = model.Comment,
                Timestamp = DateTime.UtcNow,
                ChangedById = userId,
                // Optionally, add a TimeSpent property to TaskHistory if you want to store hours
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Time and comment logged." });
        }

        // GET: api/tasks/5/history
        [Authorize]
        [HttpGet("{taskId}/history")]
        public async Task<IActionResult> GetTaskHistory(int taskId)
        {
            var taskHistory = await _context.TaskHistories
                .Where(h => h.TaskItemId == taskId)
                .OrderBy(h => h.Timestamp)
                .ToListAsync();

            if (taskHistory == null || !taskHistory.Any())
            {
                return NotFound("No history found for this task.");
            }

            return Ok(taskHistory);
        }

        public class TaskStatusUpdateModel
        {
            public string NewStatus { get; set; }
            public string Comment { get; set; }
        }

        public class TaskLogModel
        {
            public string Comment { get; set; }
            // public int TimeSpentHours { get; set; } // Uncomment if you want to track hours
        }
    }
} 