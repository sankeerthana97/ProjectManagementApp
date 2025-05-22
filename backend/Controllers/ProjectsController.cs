using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using ProjectManagementApp.API.Services;

namespace ProjectManagementApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly EmailService _emailService;
        public ProjectsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, EmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _emailService = emailService;
        }

        // GET: api/projects
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var projects = await _context.Projects.Include(p => p.Members).ToListAsync();
            return Ok(projects);
        }

        // GET: api/projects/5
        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
            if (project == null) return NotFound();
            return Ok(project);
        }

        // POST: api/projects
        [Authorize(Roles = "Manager")]
        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] Project project)
        {
            // Prevent employees from being assigned to multiple projects
            var assignedUserIds = _context.Projects.SelectMany(p => p.Members).Select(m => m.UserId).Distinct().ToList();
            var duplicate = project.Members.FirstOrDefault(m => assignedUserIds.Contains(m.UserId));
            if (duplicate != null)
                return BadRequest($"Employee with ID {duplicate.UserId} is already assigned to another project.");
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
        }

        // PUT: api/projects/5
        [Authorize(Roles = "Manager")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] Project project)
        {
            if (id != project.Id) return BadRequest();

            var existingProject = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
            if (existingProject == null) return NotFound();

            // Prevent employees from being assigned to multiple projects (excluding this project's current members)
            var assignedUserIds = await _context.Projects
                .Where(p => p.Id != id)
                .SelectMany(p => p.Members)
                .Select(m => m.UserId)
                .Distinct()
                .ToListAsync();

            var incomingMemberUserIds = project.Members.Select(m => m.UserId).ToList();

            var duplicate = incomingMemberUserIds.FirstOrDefault(userId => assignedUserIds.Contains(userId));
            if (duplicate != null)
                return BadRequest($"Employee with ID {duplicate} is already assigned to another project.");

            // Update basic project properties (excluding members for now)
            _context.Entry(existingProject).CurrentValues.SetValues(project);

            // --- Member Management Logic ---

            // Find members to remove
            var membersToRemove = existingProject.Members.Where(existingMember =>
                !incomingMemberUserIds.Contains(existingMember.UserId)).ToList();

            foreach (var memberToRemove in membersToRemove)
            {
                _context.ProjectMembers.Remove(memberToRemove);
            }

            // Find members to add
            var existingMemberUserIds = existingProject.Members.Select(m => m.UserId).ToList();
            var membersToAdd = project.Members.Where(incomingMember =>
                !existingMemberUserIds.Contains(incomingMember.UserId)).ToList();

            foreach (var memberToAdd in membersToAdd)
            {
                 // Validate role if necessary (optional)
                 if (memberToAdd.ProjectId != id) // Ensure ProjectId is correct
                 {
                     memberToAdd.ProjectId = id;
                 }
                _context.ProjectMembers.Add(memberToAdd);

                 // Optional: Notify new member
                 var user = await _userManager.FindByIdAsync(memberToAdd.UserId);
                 if (user != null && !string.IsNullOrEmpty(user.Email))
                 {
                     await _emailService.SendEmailAsync(user.Email, "Project Assignment", $"You have been assigned to project: {existingProject.Name}");
                 }
            }

            // --- End Member Management Logic ---

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/projects/5
        [Authorize(Roles = "Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project == null) return NotFound();
            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/projects/skill-matching?skills=skill1,skill2
        [Authorize(Roles = "Manager")]
        [HttpGet("skill-matching")]
        public async Task<IActionResult> SkillMatching([FromQuery] string skills)
        {
            var requiredSkills = skills.Split(',').Select(s => s.Trim().ToLower()).ToList();
            var assignedUserIds = _context.Projects.SelectMany(p => p.Members).Select(m => m.UserId).Distinct().ToList();
            var employees = await _userManager.GetUsersInRoleAsync("Employee");
            var profileCards = _context.ProfileCards.ToList();
            var matches = employees
                .Where(e => !assignedUserIds.Contains(e.Id))
                .Select(e => {
                    var card = profileCards.FirstOrDefault(pc => pc.UserId == e.Id);
                    var empSkills = (card?.Skills ?? "").Split(',').Select(s => s.Trim().ToLower()).ToList();
                    int matchCount = requiredSkills.Intersect(empSkills).Count();
                    return new {
                        UserId = e.Id,
                        e.FullName,
                        e.Email,
                        Skills = card?.Skills,
                        MatchCount = matchCount
                    };
                })
                .OrderByDescending(x => x.MatchCount)
                .ToList();
            return Ok(matches);
        }

        // POST: api/projects/{projectId}/broadcast
        [Authorize(Roles = "Manager")]
        [HttpPost("{projectId}/broadcast")]
        public async Task<IActionResult> BroadcastUpdate(int projectId, [FromBody] BroadcastModel model)
        {
            var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound();
            var userIds = project.Members.Select(m => m.UserId).ToList();
            var users = _userManager.Users.Where(u => userIds.Contains(u.Id)).ToList();
            foreach (var user in users)
            {
                // System notification
                _context.Notifications.Add(new Notification
                {
                    UserId = user.Id,
                    Message = model.Message,
                    Type = "System",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                // Email
                if (!string.IsNullOrEmpty(user.Email))
                {
                    await _emailService.SendEmailAsync(user.Email, model.Subject ?? "Project Update", model.Message);
                }
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Broadcast sent to all project members." });
        }

        // POST: api/projects/{projectId}/close
        [Authorize(Roles = "Manager")]
        [HttpPost("{projectId}/close")]
        public async Task<IActionResult> CloseProject(int projectId)
        {
            var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound();
            var tasks = await _context.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();
            if (tasks.Any(t => t.Status != "Done"))
                return BadRequest("All tasks must be marked as Done before closing the project.");
            // Confirm TeamLead approval (assume TeamLead is a member with role TeamLead)
            var teamLead = project.Members.FirstOrDefault(m => m.Role == "TeamLead");
            if (teamLead == null)
                return BadRequest("No TeamLead assigned to this project.");
            // Optionally, check for TeamLead approval flag (not implemented, can be extended)
            // Archive project
            project.IsArchived = true;
            // Generate final report
            var report = new
            {
                Project = new { project.Id, project.Name, project.StartDate, project.Deadline },
                CompletionRate = 100,
                TotalTasks = tasks.Count,
                HoursSpent = tasks.Sum(t => t.EstimatedHours ?? 0),
                Issues = await _context.Discrepancies.Where(d => d.ProjectId == projectId).ToListAsync()
            };
            // Notify members
            var userIds = project.Members.Select(m => m.UserId).ToList();
            foreach (var userId in userIds)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Message = $"Project '{project.Name}' has been closed and archived.",
                    Type = "System",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Project closed and archived.", report });
        }

        public class BroadcastModel
        {
            public string Subject { get; set; }
            public string Message { get; set; }
        }
    }
} 