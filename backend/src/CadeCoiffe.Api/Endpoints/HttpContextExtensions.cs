using System.Security.Claims;

namespace CadeCoiffe.Api.Endpoints;

public static class HttpContextExtensions
{
    public static Guid GetTenantId(this HttpContext ctx)
    {
        var claim = ctx.User.FindFirstValue("tenant_id");
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("tenant_id manquant dans le token");
        return id;
    }

    public static void RequireSuperAdmin(this HttpContext ctx)
    {
        var claim = ctx.User.FindFirstValue("is_super_admin");
        if (claim != "true")
            throw new UnauthorizedAccessException("Accès super admin requis");
    }
}
