using System;
using System.Collections.Generic;

namespace ProjectManagementApp.API.Models
{
    public class Project
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string SkillsRequired { get; set; }
        public required string Category { get; set; } // Minor, Major
        public required string Priority { get; set; } // High, Medium, Low
        public DateTime StartDate { get; set; }
        public DateTime Deadline { get; set; }
        public required string Requirements { get; set; }
        public required string TeamLeadId { get; set; }
        public required List<ProjectMember> Members { get; set; }
        public bool IsArchived { get; set; }
    }

    public class ProjectMember
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public required string UserId { get; set; }
        public required string Role { get; set; } // TeamLead, Employee
    }
} 