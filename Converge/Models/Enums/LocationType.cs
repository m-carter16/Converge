// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
using System.ComponentModel;

namespace Converge.Models.Enums
{
    public enum LocationType
    {
        [Description("In-office")]
        InOffice,
        [Description("Remote")]
        Remote,
        [Description("Hybrid")]
        Hybrid,
        [Description("Scheduled-off")]
        ScheduledOff
    }
}