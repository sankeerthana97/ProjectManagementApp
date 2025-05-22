using System;
using System.Collections.Generic;

namespace ProjectManagementApp.API.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; } // High, Medium, Low
        public DateTime DueDate { get; set; }
        public int? EstimatedHours { get; set; }
        public string Status { get; set; } // ToDo, InProgress, Review, Done, Rejected
        public string AssignedToId { get; set; }
        public List<TaskDependency> Dependencies { get; set; }
        public Project Project { get; set; }
    }

    public class TaskDependency
    {
        public int Id { get; set; }
        public int TaskItemId { get; set; }
        public int DependsOnTaskId { get; set; }
    }
} 