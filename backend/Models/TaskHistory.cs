using System;

namespace ProjectManagementApp.API.Models
{
    public class TaskHistory
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public required string Status { get; set; }
        public required string Comment { get; set; }
        public DateTime Timestamp { get; set; }
        public required string ChangedById { get; set; }
    }
} 