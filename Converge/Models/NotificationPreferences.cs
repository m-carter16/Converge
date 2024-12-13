// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Converge.Models
{
    public class NotificationPreferences
    {
      public bool Email { get; set; }

      public bool Teams { get; set; }

      public bool InApp { get; set; }

      public string Frequency { get; set; }

      public string Time { get; set; }

      public string Day { get; set; }

    }
}
