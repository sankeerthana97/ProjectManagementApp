using System;

namespace ProjectManagementApp.API.Models
{
    public class TaskHistory
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string ChangedById { get; set; } = string.Empty;
    }
} 