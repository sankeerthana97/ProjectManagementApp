using Microsoft.AspNetCore.Identity;

namespace ProjectManagementApp.API.Models
{
    public class ApplicationUser : IdentityUser
    {
        // Additional properties for profile card
        public string? FullName { get; set; }
        public string? Skills { get; set; } // Comma-separated skills
        public string? Role { get; set; } // Manager, TeamLead, Employee
        public string? ProfileImageUrl { get; set; }
        public string? Experience { get; set; }
    }
} 