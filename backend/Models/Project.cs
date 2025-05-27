using System;
using System.Collections.Generic;

namespace ProjectManagementApp.API.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SkillsRequired { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // Minor, Major
        public string Priority { get; set; } = string.Empty; // High, Medium, Low
        public DateTime StartDate { get; set; }
        public DateTime Deadline { get; set; }
        public string Requirements { get; set; } = string.Empty;
        public string TeamLeadId { get; set; } = string.Empty;
        public List<ProjectMember> Members { get; set; } = new();
        public bool IsArchived { get; set; }
    }

    public class ProjectMember
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // TeamLead, Employee
    }
} 