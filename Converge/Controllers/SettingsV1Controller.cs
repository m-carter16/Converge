// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using Converge.Helpers;
using Converge.Models;
using Converge.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Graph;
using System.Threading.Tasks;

namespace Converge.Controllers
{
    [Authorize]
    [Route("api/v1.0/settings")]
    [ApiController]
    public class SettingsV1Controller : Controller
    {
        private readonly IConfiguration configuration;
        private readonly AppGraphService appGraphService;

        public SettingsV1Controller(IConfiguration configuration, AppGraphService appGraphService)
        {
            this.configuration = configuration;
            this.appGraphService = appGraphService;
        }

        /// <summary>
        /// Gets the Application Settings
        /// </summary>
        /// <returns></returns>
        [HttpGet("appSettings")]
        public ActionResult<AppSettings> GetAppSettings()
        {
            var result = new AppSettings
            {
                ClientId = this.configuration["AzureAd:ClientId"],
                InstrumentationKey = this.configuration["AppInsightsInstrumentationKey"],
                BingAPIKey = this.configuration["BingMapsAPIKey"],
                AppBanner = this.configuration["AdminSettings:AppBannerMessage"],
                TeamsAppId = this.configuration["TeamsAppId"]
            };
            return Ok(result);
        }

        /// <summary>
        /// Gets the admin settings
        /// </summary>
        /// <returns>AdminSettings</returns>
        [HttpGet("adminSettings")]
        public async Task<AdminSettings> GetAdminSettings()
        {
            ListItem listItem = await appGraphService.GetAdminSettings();
            AdminSettings adminSettings = DeserializeHelper.DeserializeAdminSettings(listItem.Fields.AdditionalData);

            return adminSettings;
        }

         /// <summary>
        /// Updates the admin settings
        /// </summary>
        /// <returns>AdminSettings</returns>
        [HttpPost("adminSettings")]
        public async Task<ActionResult> SetAdminSettings(AdminSettings adminSettings)
        {
            var result = await appGraphService.SetAdminSettings(adminSettings);
            return Ok(result);
        }

        /// <summary>
        /// Check if user is an admin
        /// </summary>
        /// <returns></returns>
        [HttpGet("isConvergeAdmin")]
        public async Task<ActionResult> IsConvergeAdmin(string userId)
        {
            var result = await appGraphService.IsConvergeAdmin(userId);
            return Ok(result);
        }
    }
}
