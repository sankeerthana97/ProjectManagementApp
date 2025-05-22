using System;

namespace ProjectManagementApp.API.Models
{
    public class ProjectHistory
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string ChangeDescription { get; set; }
        public DateTime Timestamp { get; set; }
        public string ChangedById { get; set; }
    }
} 