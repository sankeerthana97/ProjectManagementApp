using System;

namespace ProjectManagementApp.API.Models
{
    public class Notification
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Message { get; set; }
        public string Type { get; set; } // Email, System
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
} 