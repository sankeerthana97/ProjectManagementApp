using System;

namespace ProjectManagementApp.API.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Email, System
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
} 