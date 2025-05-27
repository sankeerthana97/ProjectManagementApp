using System;

namespace ProjectManagementApp.API.Models
{
    public class Discrepancy
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string RaisedById { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Open, Resolved
        public string? ResolutionComment { get; set; }
        public DateTime RaisedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
} 