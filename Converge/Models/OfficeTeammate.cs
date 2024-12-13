// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
using Microsoft.Graph;

namespace Converge.Models
{
    public class OfficeTeammate
    {
      public DirectoryObject Mate { get; set; }
      public string Location { get; set; }

      public OfficeTeammate(DirectoryObject mate, string location)
      {
        Mate = mate;
        Location = location;
      }
    }
}