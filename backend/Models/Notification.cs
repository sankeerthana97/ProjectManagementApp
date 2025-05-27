using System;

namespace ProjectManagementApp.API.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public required string UserId { get; set; }
        public required string Message { get; set; }
        public required string Type { get; set; } // Email, System
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
} 