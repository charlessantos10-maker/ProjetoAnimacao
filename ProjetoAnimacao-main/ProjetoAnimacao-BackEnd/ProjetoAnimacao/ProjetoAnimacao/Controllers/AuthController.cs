
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjetoAnimacao.Contracts;
using ProjetoAnimacao.Data;
using ProjetoAnimacao.Models;
using ProjetoAnimacao.Services;

namespace ProjetoAnimacao.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    ProjetoAnimacaoDbContext db,
    PasswordService passwords,
    TokenService tokens) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length < 8)
        {
            return BadRequest("Informe nome, e-mail e senha com pelo menos 8 caracteres.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(x => x.Email == email))
            return Conflict("Este e-mail já está cadastrado.");

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email
        };

        user.PasswordHash = passwords.Hash(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var (token, expires) = tokens.Create(user);

        return Ok(new AuthResponse(
            token,
            expires,
            new UserResponse(user.Id, user.Name, user.Email)
        ));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Informe o e-mail e a senha.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email);

        if (user is null || !passwords.Verify(user, request.Password))
            return Unauthorized("E-mail ou senha inválidos.");

        var (token, expires) = tokens.Create(user);

        return Ok(new AuthResponse(
            token,
            expires,
            new UserResponse(user.Id, user.Name, user.Email)
        ));
    }
}
