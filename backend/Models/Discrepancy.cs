using System;

namespace ProjectManagementApp.API.Models
{
    public class Discrepancy
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string RaisedById { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } // Open, Resolved
        public string? ResolutionComment { get; set; }
        public DateTime RaisedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
} 