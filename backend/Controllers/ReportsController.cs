using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/project-progress/{projectId}
        [Authorize]
        [HttpGet("project-progress/{projectId}")]
        public async Task<IActionResult> GetProjectProgress(int projectId)
        {
            var tasks = await _context.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();
            var result = tasks.GroupBy(t => t.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToList();
            return Ok(result);
        }

        // GET: api/reports/resource-allocation
        [Authorize(Roles = "Manager")]
        [HttpGet("resource-allocation")]
        public async Task<IActionResult> GetResourceAllocation()
        {
            var allocation = await _context.Tasks
                .GroupBy(t => t.AssignedToId)
                .Select(g => new { UserId = g.Key, Hours = g.Sum(t => t.EstimatedHours ?? 0) })
                .ToListAsync();
            return Ok(allocation);
        }

        // GET: api/reports/discrepancy-status
        [Authorize(Roles = "Manager")]
        [HttpGet("discrepancy-status")]
        public async Task<IActionResult> GetDiscrepancyStatus()
        {
            var result = await _context.Discrepancies
                .GroupBy(d => d.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();
            return Ok(result);
        }

        // GET: api/reports/task-rejection-trends
        [Authorize(Roles = "Manager,TeamLead")]
        [HttpGet("task-rejection-trends")]
        public async Task<IActionResult> GetTaskRejectionTrends()
        {
            var result = await _context.TaskHistories
                .Where(h => h.Status == "Rejected")
                .GroupBy(h => h.ChangedById)
                .Select(g => new { UserId = g.Key, RejectedCount = g.Count() })
                .ToListAsync();
            return Ok(result);
        }

        // GET: api/reports/export/project-progress/{projectId}
        [Authorize(Roles = "Manager")]
        [HttpGet("export/project-progress/{projectId}")]
        public async Task<IActionResult> ExportProjectProgressCsv(int projectId)
        {
            var tasks = await _context.Tasks.Where(t => t.ProjectId == projectId).ToListAsync();
            var csv = "Status,Count\n" + string.Join("\n",
                tasks.GroupBy(t => t.Status)
                    .Select(g => $"{g.Key},{g.Count()}")
            );
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", $"project_{projectId}_progress.csv");
        }

        // GET: api/reports/project-task-summary/{projectId}
        [Authorize(Roles = "Manager")]
        [HttpGet("project-task-summary/{projectId}")]
        public async Task<IActionResult> GetProjectTaskSummarySP(int projectId)
        {
            var conn = _context.Database.GetDbConnection();
            await conn.OpenAsync();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "GetProjectTaskSummary";
            cmd.CommandType = System.Data.CommandType.StoredProcedure;
            var param = cmd.CreateParameter();
            param.ParameterName = "@ProjectId";
            param.Value = projectId;
            cmd.Parameters.Add(param);
            var reader = await cmd.ExecuteReaderAsync();
            var result = new System.Collections.Generic.List<object>();
            while (await reader.ReadAsync())
            {
                result.Add(new
                {
                    Status = reader["Status"].ToString(),
                    TaskCount = (int)reader["TaskCount"]
                });
            }
            await conn.CloseAsync();
            return Ok(result);
        }

        // GET: api/reports/project-velocity/{projectId}
        [Authorize(Roles = "Manager,TeamLead")]
        [HttpGet("project-velocity/{projectId}")]
        public async Task<IActionResult> GetProjectVelocity(int projectId)
        {
            // For simplicity, calculating tasks completed per week
            var completedTasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.Status == "Done")
                .ToListAsync();

            var velocityData = completedTasks
                .GroupBy(t => (t.CompletionDate ?? DateTime.UtcNow).StartOfWeek(DayOfWeek.Monday))
                .Select(g => new { WeekStart = g.Key, CompletedCount = g.Count() })
                .OrderBy(g => g.WeekStart)
                .ToList();

            return Ok(velocityData);
        }

        // GET: api/reports/project-completion-by-priority/{projectId}
        [Authorize(Roles = "Manager,TeamLead")]
        [HttpGet("project-completion-by-priority/{projectId}")]
        public async Task<IActionResult> GetProjectCompletionByPriority(int projectId)
        {
            var completionData = await _context.Tasks
                .Where(t => t.ProjectId == projectId && t.Status == "Done")
                .GroupBy(t => t.Priority)
                .Select(g => new { Priority = g.Key, CompletedCount = g.Count() })
                .ToListAsync();

            return Ok(completionData);
        }
    }
}

// Extension method class must be outside the controller class and namespace it as needed
public static class DateTimeExtensions
{
    public static DateTime StartOfWeek(this DateTime dt, DayOfWeek startOfWeek)
    {
        var diff = (7 + (dt.DayOfWeek - startOfWeek)) % 7;
        return dt.AddDays(-1 * diff).Date;
    }
}
