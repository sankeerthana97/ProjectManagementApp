using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementApp.API.Models;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementApp.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProfileCardsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        public ProfileCardsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/profilecards
        [Authorize(Roles = "Manager")]
        [HttpGet]
        public async Task<IActionResult> GetProfileCards()
        {
            var cards = await _context.ProfileCards.Include(p => p.User).ToListAsync();
            return Ok(cards);
        }

        // GET: api/profilecards/me
        [Authorize(Roles = "Employee")]
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfileCard()
        {
            var userId = _userManager.GetUserId(User);
            var card = await _context.ProfileCards.FirstOrDefaultAsync(p => p.UserId == userId);
            if (card == null) return NotFound();
            return Ok(card);
        }

        // POST: api/profilecards
        [Authorize(Roles = "Employee")]
        [HttpPost]
        public async Task<IActionResult> CreateProfileCard([FromBody] ProfileCard card)
        {
            card.UserId = _userManager.GetUserId(User);
            _context.ProfileCards.Add(card);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMyProfileCard), new { }, card);
        }

        // PUT: api/profilecards/me
        [Authorize(Roles = "Employee")]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfileCard([FromBody] ProfileCard card)
        {
            var userId = _userManager.GetUserId(User);
            var existing = await _context.ProfileCards.FirstOrDefaultAsync(p => p.UserId == userId);
            if (existing == null) return NotFound();
            existing.Skills = card.Skills;
            existing.Experience = card.Experience;
            existing.ProfileImageUrl = card.ProfileImageUrl;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/profilecards/{id}
        [Authorize(Roles = "Manager")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProfileCard(int id)
        {
            var card = await _context.ProfileCards.FindAsync(id);
            if (card == null) return NotFound();
            _context.ProfileCards.Remove(card);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
} 