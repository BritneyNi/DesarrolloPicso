using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;




[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class AuthorizeRoleAttribute : Attribute, IAuthorizationFilter
{
    private readonly string[] _rolesPermitidos;
    private readonly string[] _cedulasPermitidas;

    public AuthorizeRoleAttribute(string[] rolesPermitidos, string[] cedulasPermitidas = null)
    {
        _rolesPermitidos = rolesPermitidos;
        _cedulasPermitidas = cedulasPermitidas ?? Array.Empty<string>();
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        // 1️⃣ Revisar si el usuario tiene el rol permitido
        var rol = user.FindFirst("rol")?.Value;
        var cedula = user.FindFirst("cedula")?.Value;

        bool rolOk = _rolesPermitidos.Contains(rol);
        bool cedulaOk = _cedulasPermitidas.Contains(cedula);

        if (!rolOk && !cedulaOk)
        {
            context.Result = new ForbidResult(); // 403
        }
    }
}
