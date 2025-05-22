using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;
using System;
using System.Threading.Tasks;

namespace ProjectManagementApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiscrepanciesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public DiscrepanciesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/discrepancies
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetDiscrepancies()
        {
            var discrepancies = await _context.Discrepancies.ToListAsync();
            return Ok(discrepancies);
        }

        // POST: api/discrepancies
        [Authorize(Roles = "TeamLead")]
        [HttpPost]
        public async Task<IActionResult> RaiseDiscrepancy([FromBody] Discrepancy discrepancy)
        {
            discrepancy.Status = "Open";
            discrepancy.RaisedAt = DateTime.UtcNow;
            _context.Discrepancies.Add(discrepancy);
            await _context.SaveChangesAsync();
            return Ok(discrepancy);
        }

        // PUT: api/discrepancies/{id}/resolve
        [Authorize(Roles = "Manager")]
        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> ResolveDiscrepancy(int id, [FromBody] string resolutionComment)
        {
            var discrepancy = await _context.Discrepancies.FindAsync(id);
            if (discrepancy == null) return NotFound();
            discrepancy.Status = "Resolved";
            discrepancy.ResolutionComment = resolutionComment;
            discrepancy.ResolvedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(discrepancy);
        }
    }
} 