using System;
using System.Collections.Generic;

namespace ProjectManagementApp.API.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty; // High, Medium, Low
        public DateTime DueDate { get; set; }
        public int? EstimatedHours { get; set; }
        public string Status { get; set; } = string.Empty; // ToDo, InProgress, Review, Done, Rejected
        public string AssignedToId { get; set; } = string.Empty;
        public DateTime? CompletionDate { get; set; }
        public List<TaskDependency> Dependencies { get; set; } = new();
        public Project Project { get; set; } = null!;
    }

    public class TaskDependency
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public int DependsOnTaskId { get; set; }
    }
} 