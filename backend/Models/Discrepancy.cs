using System;

namespace ProjectManagementApp.API.Models
{
    public class Discrepancy
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public required string RaisedById { get; set; }
        public required string Description { get; set; }
        public required string Status { get; set; } // Open, Resolved
        public string? ResolutionComment { get; set; }
        public DateTime RaisedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
} 