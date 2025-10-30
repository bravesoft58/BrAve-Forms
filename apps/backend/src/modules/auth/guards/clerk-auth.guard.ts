import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class ClerkAuthGuard extends AuthGuard('clerk') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = GqlExecutionContext.create(context).getContext().req;

    // Dev single-tenant override: inject fixed user/org when enabled
    const devSingleTenant = process.env.DEV_SINGLE_TENANT === 'true';
    if (devSingleTenant && request) {
      const devOrgId = process.env.DEV_ORG_ID || 'system';
      const devUserId = process.env.DEV_USER_ID || 'dev-user';
      const devOrgRole = process.env.DEV_ORG_ROLE || 'ADMIN';

      request.user = {
        userId: devUserId,
        orgId: devOrgId,
        orgRole: devOrgRole,
      };
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    if (!request) {
      throw new UnauthorizedException('No request object found');
    }

    return request;
  }

  handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    if (!user.orgId) {
      throw new UnauthorizedException('Organization context required');
    }

    return user;
  }
}
