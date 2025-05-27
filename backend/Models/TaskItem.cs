using System;
using System.Collections.Generic;

namespace ProjectManagementApp.API.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public required string Priority { get; set; } // High, Medium, Low
        public DateTime DueDate { get; set; }
        public int? EstimatedHours { get; set; }
        public required string Status { get; set; } // ToDo, InProgress, Review, Done, Rejected
        public required string AssignedToId { get; set; }
        public DateTime? CompletionDate { get; set; }
        public required List<TaskDependency> Dependencies { get; set; }
        public required Project Project { get; set; }
    }

    public class TaskDependency
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public int DependsOnTaskId { get; set; }
    }
} 