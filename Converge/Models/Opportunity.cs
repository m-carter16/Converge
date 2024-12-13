// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
namespace Converge.Models
{
    public class Opportunity
    {
        public Microsoft.Graph.User User { get; set; }
        
        public string UserId { get; set; }

        public string Location { get; set; }

        public bool Dismissed { get; set; }

        public bool SetByUser { get; set; }
    }

}
