// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

namespace Converge.Models
{
    public class AdminSettings
    {
        public bool? WorkspaceEnabled { get; set; }

        public string AppBannerMessage { get; set; }

        public string AppBannerType { get; set; }

        public string AppBannerExpiration { get; set; }
    }
}
