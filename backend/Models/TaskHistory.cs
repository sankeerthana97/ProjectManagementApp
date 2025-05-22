using System;

namespace ProjectManagementApp.API.Models
{
    public class TaskHistory
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public string Status { get; set; }
        public string Comment { get; set; }
        public DateTime Timestamp { get; set; }
        public string ChangedById { get; set; }
    }
} 