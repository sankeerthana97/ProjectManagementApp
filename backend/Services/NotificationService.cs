using ProjectManagementApp.API.Models;
using System;
using System.Threading.Tasks;

namespace ProjectManagementApp.API.Services
{
    public class NotificationService
    {
        private readonly ApplicationDbContext _context;
        public NotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task NotifyAsync(string userId, string message, string type = "System")
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Message = message,
                Type = type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
    }
} 