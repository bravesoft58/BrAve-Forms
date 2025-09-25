import { Resolver, Query, ObjectType, Field, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  orgId: string;

  @Field()
  orgRole: string;
}

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, {
    name: 'me',
    description: 'Get current authenticated user'
  })
  @UseGuards(ClerkAuthGuard)
  async getCurrentUser(
    @CurrentUser() user: CurrentUser,
  ): Promise<User> {
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      orgId: user.orgId,
      orgRole: user.orgRole,
    };
  }
}
