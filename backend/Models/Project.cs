using System;
using System.Collections.Generic;

namespace ProjectManagementApp.API.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string SkillsRequired { get; set; }
        public string Category { get; set; } // Minor, Major
        public string Priority { get; set; } // High, Medium, Low
        public DateTime StartDate { get; set; }
        public DateTime Deadline { get; set; }
        public string Requirements { get; set; }
        public string TeamLeadId { get; set; }
        public List<ProjectMember> Members { get; set; }
        public bool IsArchived { get; set; }
    }

    public class ProjectMember
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string UserId { get; set; }
        public string Role { get; set; } // TeamLead, Employee
    }
} 