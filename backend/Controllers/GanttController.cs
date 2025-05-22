using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GanttController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public GanttController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/gantt/project/{projectId}
        [Authorize]
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetGanttData(int projectId)
        {
            var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound();
            var tasks = await _context.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();
            var ganttTasks = tasks.Select(t => new
            {
                id = t.Id.ToString(),
                name = t.Title,
                start = t.DueDate.AddDays(-7).ToString("yyyy-MM-dd"), // Example: 1 week before due as start
                end = t.DueDate.ToString("yyyy-MM-dd"),
                progress = t.Status == "Done" ? 100 : t.Status == "Review" ? 80 : t.Status == "InProgress" ? 50 : 0,
                dependencies = string.Join(",", t.Dependencies?.Select(d => d.DependsOnTaskId.ToString()) ?? new string[0])
            }).ToList();
            return Ok(new
            {
                project = new { id = project.Id, name = project.Name, start = project.StartDate.ToString("yyyy-MM-dd"), end = project.Deadline.ToString("yyyy-MM-dd") },
                tasks = ganttTasks
            });
        }
    }
} 