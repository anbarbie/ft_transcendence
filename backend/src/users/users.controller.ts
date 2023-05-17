import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, ParseIntPipe, Query, UseGuards, UseInterceptors, UploadedFile, Request, Res, BadRequestException, NotAcceptableException, UsePipes, ValidationPipe, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UserRequestDto, FriendshipDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags, ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard/jwt.guard'
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path = require('path');
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid'
import { User, Channel } from '@prisma/client';

export const storage = {
  storage: diskStorage({
    destination: './uploads/profileImages',
    filename: (req, file, cb) => {
        const filename: string = path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
        const extension: string = path.parse(file.originalname).ext;

        cb(null, `${filename}${extension}`)
    }
  })
}

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiQuery({
    name: 'username',
    required: false,
    type: String
  })
  @ApiOkResponse({
    description: 'Returns an array of User or a specific User if used as a query',
  })
  @ApiNotFoundResponse({
    description: `Specific user doesn't exist`,
  })
  @ApiOperation({ summary: 'Get all users, you can also use an optional query parameter to get a user by its username by using /users?username=[username]'})
  async getUsers(@Query('username') username: string) {
    if (username)
    {
      const user = await this.usersService.findbyUsername(username);
      if (!user) {
        throw new NotFoundException(`User ${username} does not exist`);
      }
      return (user);
    }
    return this.usersService.findAll();
  }

  @Get('whispers')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Get direct messages channel where two given users are present'})
  async getWhispers(@Query() friendshipDto: FriendshipDto)
  {
    const channel = await this.usersService.getWhispers(friendshipDto);
    if (!channel)
      throw new NotFoundException('No direct messages channel between these two users');
    return channel;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by its id'})
  @ApiOkResponse({
    description: 'Returns a User',
  })
  @ApiNotFoundResponse({
    description: `User with this id doesn't exist`,
  })
  async getUserbyID(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id of ${id} does not exist`);
    }
    return (user);
  }

/*   @Get()
  async findbyUsername(@Query() username: string) {
    const user = await this.usersService.findbyUsername(username);

    if (!user) {
      throw new NotFoundException(`User ${username} does not exist`);
    }
    return (user);
  } */


  @Get(':id/friends')
  @ApiOperation({ summary: 'Get the friendlist of a user by its ID'})
  @ApiOkResponse({
    description: 'Returns an array of User',
  })
  @ApiNotFoundResponse({
    description: `User with this id doesn't exist`,
  })
  async getFriends(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id of ${id} does not exist`);
    }
    return this.usersService.getFriends(user.friendList);
  }

  @UseGuards(JwtGuard)
  @Post('upload')
  @ApiOperation({ summary: 'Upload an image and update the profile picture of the user identified by its JWT (Needs a valid JWT)'})
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No JWT provided or JWT invalid'
  })
  @ApiOkResponse({
    description: 'Profile image of the User has been succesfully uploaded and its path in the user record updated',
  })
  @UseInterceptors(FileInterceptor('file', storage))
  uploadfile(@UploadedFile() file, @Request() req) {
    if (!file)
      throw new BadRequestException('No file or empty file');
    const user: User = req.user;
    console.log(user);
    console.log(file);
    return this.usersService.update(user.id, {
      avatar: file.path
    })
  }

  @Get(':id/profileImage')
  @ApiOperation({ summary: 'Get the profile image of a user by its id'})
  @ApiOkResponse({
    description: 'Returns the profile image of the given User',
  })
  @ApiNotFoundResponse({
    description: `User with this id doesn't exist`,
  })
  async getProfileImage(@Param('id', ParseIntPipe) id: number, @Res() res): Promise<any> {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException(`User with id of ${id} does not exist`);
    }

    res.sendFile(join(process.cwd(), user.avatar));
  }

  @Get(':id/channels')
  @ApiOperation({ summary: 'Get the private/protected/public channels where the user is a member' })
  getChannels(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getChannels(id);
  }

  @Get(':id/friendRequest')
  @ApiOperation({ summary: 'Get all friend requests for a given user'})
  async getFriendRequest(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (!user)
      throw new NotFoundException(`User with id of ${id} not found`);
    return this.usersService.getFriendRequest(user);
  }

  @Post('friend')
  @ApiOperation({ summary: 'Makes two users add each other to their friendlist, this controller will be changed in the future to require an invite, this is only used for testing'})
  async addFriend(@Body() friendshipDto: FriendshipDto)
  {
    const user = await this.usersService.findOne(friendshipDto.id);
    const friend = await this.usersService.findOne(friendshipDto.friendId);

    if (!user) {
      throw new NotFoundException(`User with id of ${friendshipDto.id} does not exist`);
    }
    if (!friend) {
      throw new NotFoundException(`User with id of ${friendshipDto.friendId} does not exist`);
    }

    if (user.friendList.includes(friendshipDto.friendId)) {
      throw new NotAcceptableException('Already friend!')
    }

    this.usersService.addFriend(friendshipDto.id, friendshipDto.friendId);
    this.usersService.addFriend(friendshipDto.friendId, friendshipDto.id);
  }

  @UseGuards(JwtGuard)
  @Post('friendRequest')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a pending friend request to another user, if it is accepted, both users will add each other to their friend list'})
  async sendFriendRequest(@Body() friendRequestDto: UserRequestDto, @Request() req)
  {
    const user: User = req.user;
    const friend = await this.usersService.findOne(friendRequestDto.id);
    if (!friend)
      throw new NotFoundException(`User with id of ${friendRequestDto.id} doesn't exist`);
    if (friend.id === user.id)
      throw new ForbiddenException(`Can't add yourself as friend`);
    if (friend.blockedList.includes(user.id))
      throw new ForbiddenException(`Blocked`);
    if (await this.usersService.checkFriendRequest(user.id, friend.id))
      throw new NotAcceptableException(`Already exists a pending friend request between these two users`);
    if (friend.friendList.includes(user.id))
       throw new NotAcceptableException(`Already friends!`);
    return await this.usersService.sendFriendRequest(friend, user);
  }

  @Post(':id/friendRequest/:requestid')
  @ApiOperation({ summary: 'Accept a pending friend request with a given id, both users will add each other to their friend lists'})
  async acceptFriendRequest(@Param('id', ParseIntPipe) id: number, @Param('requestid', ParseIntPipe) requestId: number) {
    const user = await this.usersService.findOne(id);
    if (!user)
      throw new NotFoundException(`User with id of ${id} not found`);
    return await this.usersService.acceptFriendRequest(id, requestId);
  }

  @Delete(':id/friendRequest/:requestid')
  @ApiOperation({ summary: 'Remove a pending friend request with a given id'})
  async deleteFriendRequest(@Param('id', ParseIntPipe) id: number, @Param('requestid', ParseIntPipe) requestId: number) {
    const user = await this.usersService.findOne(id);
    if (!user)
      throw new NotFoundException(`User with id of ${id} not found`);
    return await this.usersService.deleteFriendRequest(id, requestId);
  }


  @UseGuards(JwtGuard)
  @Post('block')
  @ApiOperation({ summary: 'Block a user with a given id'})
  @ApiBearerAuth()
  @ApiBody({type: UserRequestDto})
  async blockUser(@Body('id', ParseIntPipe) id: number, @Request() req) {
    const user: User = req.user;
    const blockedUser = await this.usersService.findOne(id);
    if (!blockedUser)
      throw new NotFoundException(`User with id of ${id} does not exist`);
    if (user.blockedList.includes(id))
      throw new NotAcceptableException(`User is already blocked`);
    if (id === user.id)
      throw new NotAcceptableException(`Can't block yourself`);
    return this.usersService.blockUser(user, id);
  }

  @UseGuards(JwtGuard)
  @Delete('block')
  @ApiOperation({ summary: 'Remove a user with a given id from a blocked user list'})
  @ApiBearerAuth()
  @ApiBody({type: UserRequestDto})
  async unblockUser(@Body('id', ParseIntPipe) id: number, @Request() req) {
    const user: User = req.user;
    const unblockedUser = await this.usersService.findOne(id);
    if (!unblockedUser)
      throw new NotFoundException(`User with id of ${id} does not exist`);
    if (!user.blockedList.includes(id))
      throw new NotAcceptableException(`User is not blocked`);
    if (id === user.id)
      throw new NotAcceptableException(`Can't unblock yourself`);
    return this.usersService.unblockUser(user, id);
  }

  @Delete('friend')
  @ApiOperation({ summary: 'Makes two users remove each other to their friendlist, might need to be one-way only. Let me know what you prefer'})
  async removeFriend(@Body() friendshipDto: FriendshipDto)
  {
    const user = await this.usersService.findOne(friendshipDto.id);
    const friend = await this.usersService.findOne(friendshipDto.friendId);

    if (!user) {
      throw new NotFoundException(`User with id of ${friendshipDto.id} does not exist`);
    }
    if (!friend) {
      throw new NotFoundException(`User with id of ${friendshipDto.friendId} does not exist`);
    }

    if (!user.friendList.includes(friendshipDto.friendId)) {
      throw new NotAcceptableException('Not friends!')
    }

    this.usersService.removeFriend(friendshipDto.id, friendshipDto.friendId);
    this.usersService.removeFriend(friendshipDto.friendId, friendshipDto.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update the user, all the fields are optional. Will be protected by JWT in the future'})
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletes a user by its id'})
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
