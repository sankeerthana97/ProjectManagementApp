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
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        public NotificationsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/notifications
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = _userManager.GetUserId(User);
            var notifications = await _context.Notifications.Where(n => n.UserId == userId).ToListAsync();
            return Ok(notifications);
        }
    }
} 