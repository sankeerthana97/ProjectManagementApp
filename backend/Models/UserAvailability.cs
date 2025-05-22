using System;

namespace ProjectManagementApp.API.Models
{
    public class UserAvailability
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int AvailableHoursPerWeek { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }
} 