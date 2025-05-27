using System;

namespace ProjectManagementApp.API.Models
{
    public class ProjectHistory
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public required string ChangeDescription { get; set; }
        public DateTime Timestamp { get; set; }
        public required string ChangedById { get; set; }
    }
} 