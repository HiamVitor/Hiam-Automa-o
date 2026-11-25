# FluxoPessoal — Especificação de Segurança (Phase 0 TDD)

## 1. Data Invariants
1. Um documento `/users/{userId}` só pode ser criado pelo próprio usuário verificado (`request.auth.uid == userId && email_verified == true`), com `status == 'ativo'` e `role == 'user'` (exceto admin inicial `hiamvitorb@gmail.com` verificado).
2. Nenhum usuário comum pode alterar o próprio `role` ou `status` em `/users/{userId}`. Somente administradores verificados podem promover/rebaixar (`role`) ou bloquear/ativar (`status`).
3. Dados pessoais (PII como `email`) nunca ficam em `/users/{userId}`; ficam isolados em `/users/{userId}/private/info`, legíveis apenas pelo próprio dono ou por um administrador.
4. Um documento `/workspaces/{workspaceId}` exige `workspaceId == request.auth.uid`, `ownerId == request.auth.uid` (imutável), e o usuário deve existir e estar com `status == 'ativo'` no documento pai `/users/{uid}`.
5. Usuários bloqueados (`status == 'bloqueado'`) não podem criar nem atualizar `/workspaces/{workspaceId}`.
6. Todos os timestamps (`createdAt`, `updatedAt`, `lastLoginAt`) devem ser iguais a `request.time`.
7. Todas as IDs de caminho (`userId`, `adminUid`, `workspaceId`, `logId`) devem passar por `isValidId()`.

## 2. Dirty Dozen Payloads (Must All Return PERMISSION_DENIED)
1. **Self-Role Escalation on Create**: Usuário comum tenta criar `/users/u1` com `role: 'admin'`.
2. **Self-Role Escalation on Update**: Usuário comum tenta atualizar `/users/u1` enviando `role: 'admin'` ou `status: 'ativo'`.
3. **Ghost Field Injection**: Payload em `/users/u1` inclui campo fantasma `isSuperUser: true`.
4. **Unverified Email Spoof**: Token com `email: 'hiamvitorb@gmail.com'` e `email_verified: false` tenta acesso administrativo.
5. **PII Snooping**: Usuário autenticado `u2` tenta ler `/users/u1/private/info`.
6. **Workspace Ownership Hijack**: Usuário `u2` tenta criar `/workspaces/u2` com `ownerId: 'u1'` ou ler `/workspaces/u1`.
7. **Immutable Owner Mutation**: Usuário `u1` tenta atualizar `/workspaces/u1` alterando `ownerId` ou `createdAt`.
8. **Blocked User Write**: Usuário `u1` com `status: 'bloqueado'` em `/users/u1` tenta atualizar `/workspaces/u1`.
9. **Client Timestamp Forgery**: Payload envia `createdAt` ou `updatedAt` diferente de `request.time`.
10. **Path ID Poisoning**: Escrita com ID contendo caracteres inválidos ou > 128 caracteres (`../admin` ou string de 300 chars).
11. **Unbounded Array Flood**: Payload em `/workspaces/u1` com `movements` acima do limite permitido (`size() > 2000`).
12. **Non-Admin Marker Tamper**: Usuário comum `u1` tenta criar `/admins/u1` ou `/adminLogs/log1`.
