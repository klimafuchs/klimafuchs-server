import {Arg, Authorized, Ctx, Int, Mutation, Query, Resolver} from "type-graphql";
import {InjectRepository} from "typeorm-typedi-extensions";
import {Role, User} from "../entity/user/User";
import {Like, Repository} from "typeorm";
import {FeedPost} from "../entity/social/FeedPost";
import {UserInput} from "./types/UserInput";
import {Media} from "../entity/Media";
import has = Reflect.has;
import {Membership} from "../entity/social/Membership";
import {Team} from "../entity/social/Team";
import {GraphQLUpload, Upload} from "apollo-upload-server";
import {Context} from "./types/Context";
import {NewTeamInput} from "./types/NewTeamInput";
import {Container, Inject} from "typedi";
import {publish} from "../util/EventUtil";
import {AsyncSome} from "../util/AsyncCollection";

@Resolver()
export class TeamResolver {

    constructor(
        @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Team) private readonly teamRepository: Repository<Team>,
        @InjectRepository(Membership) private readonly memberRepository: Repository<Membership>
    ) {}

    private async _joinTeam(user: User, team: Team): Promise<Membership> {
        const currentMembers = await team.members;
      /*  if(AsyncSome(currentMembers, async m => {
            return (await m.user).id === user.id
        })) {
            return Promise.reject(`${user.screenName} is already a member of ${team.name}`)
        } */
        let newMembership = new Membership();
        newMembership.user = Promise.resolve(user);
        newMembership.team = Promise.resolve(team);
        return this.memberRepository.save(newMembership);
    }

    private

    private async _confirm(memberShip: Membership): Promise<Membership> {
        memberShip.isActive = true;
        memberShip.activationDate = new Date(Date.now());
        publish(memberShip, "add", true);
        return this.memberRepository.save(memberShip);
    }

    private async _modUser(memberShip: Membership): Promise<Membership> {
        memberShip.isAdmin = true;
        return this.memberRepository.save(memberShip);
    }

    private async _setTeamAvatar(mediaId: number, team: Team): Promise<Team> {
        const media = await this.mediaRepository.findOne(mediaId);
        if (media) {
            team.avatar = Promise.resolve(media);
            return this.teamRepository.save(team);
        } else return Promise.reject("invalid media assignment");
    }

    private async _membershipsContain(memberships: Membership[], teamId) {
        const teams = await Promise.all(memberships.map(async (membership) => {
            return await membership.team;
        }));
        return teams.find( (team) => team.id === teamId)

    }

    private async _hasTeamAuthority(user: User, team: Team): Promise<Boolean> {
        const contextUserTeamMembership = await this._membershipsContain(await user.memberships, team);
        return contextUserTeamMembership ? (await this._getTeamMembership(user, contextUserTeamMembership.id)).isAdmin : false;
    }

    private async _getTeamMembership(user: User, teamId: number) : Promise<Membership>{
        const team = await this._membershipsContain(await user.memberships, teamId);
        if(team){
            const teamMemberships = await team.members;
            const filteredMemberships = await Promise.all(teamMemberships.map(async (m) => {
                const currentMembershipUser = await m.user;
                return currentMembershipUser.id === user.id ? m : null;
            }));
            return filteredMemberships.filter( (val) => val !== null)[0];
        }
        return null;
    }

    @Mutation(returns => Team)
    async createTeam(@Arg('team', type => NewTeamInput) teamInput: NewTeamInput,
                     @Ctx() {user}: Context): Promise<Team> {

        const conflict = await this.teamRepository.findOne({where: {name: teamInput.teamName}});
        if(conflict) return  Promise.reject("A team with this name already exists!");
        let newTeam = new Team();

        newTeam.name = teamInput.teamName;
        let team = await this.teamRepository.save(newTeam);

        if (teamInput.mediaId) team = await this._setTeamAvatar(teamInput.mediaId, team);
        let membership = await this._joinTeam(user, team);
        membership = await this._confirm(membership);
        membership = await this._modUser(membership);

        return this.teamRepository.findOne(team.id);

    }

    @Query(returns => Team)
    async getMyTeam(@Arg("teamId", type => Int) teamId: number, @Ctx() {user}: Context) : Promise<Team>{
        const memberships = await user.memberships;
        return this._membershipsContain(memberships, teamId);
    }

    @Query(returns => [Membership])
    async myMemberships(@Ctx() {user}: Context) : Promise<Membership[]>{
        return user.memberships;
    }

    @Mutation(returns => Membership)
    async requestJoinTeam(@Arg("teamId", type => Int) teamId: number, @Ctx() {user}: Context) : Promise<Membership> {
        const team = await this.teamRepository.findOne(teamId);
        return team ? this._joinTeam(user, team) : Promise.reject(`Team with id ${ teamId } doesn't exist!`)
    }

    @Mutation(returns => Membership)
    async confirmMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if(!membership) return Promise.reject('membershipId not found!');
        if(await this._hasTeamAuthority(user, await membership.team)) {
            return this._confirm(membership)
        } else {
            return Promise.reject('no team authority');
        }
    }

    @Mutation(returns => Membership)
    async modMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if(!membership) return Promise.reject('membershipId not found!');
        if(await this._hasTeamAuthority(user, await membership.team)) {
            return this._modUser(membership)
        } else {
            return Promise.reject('no team authority');
        }
    }

    @Mutation(returns => Membership)
    async leaveTeam(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if((await membership.user).id === user.id) {
            return await this.deleteMembership(membership);
        } else {
            return Promise.reject('no team authority');
        }
    }

    @Mutation(returns => Membership)
    async delMember(@Arg("membershipId", type => Int) membershipId: number, @Ctx() {user}: Context) {
        const membership = await this.memberRepository.findOne(membershipId);
        if(!membership) return Promise.reject('membershipId not found!');
        if(await this._hasTeamAuthority(user, await membership.team)) {
            return await this.deleteMembership(membership);
        } else {
            return Promise.reject('no team authority');
        }
    }

    private async deleteMembership(membership: Membership) {
        const deletedMembership = await this.memberRepository.remove(membership);
        publish(deletedMembership, "remove", true);
        const team = await deletedMembership.team;
        const members = await (team).members;
        if (members.length === 0) {
            this.teamRepository.remove(team).then(res => console.log(`Deleted ${team}: no memebers left!`));
        }
        return deletedMembership;
    }

//todo use a real search provider for this
    @Query(returns => [Team])
    async searchTeamsByName(@Arg("teamName", type => String) teamName: String) : Promise<Team[]> {
        return this.teamRepository.find({where:{name: Like(`%${teamName}%`)}})
    }

    @Mutation(returns => Membership)
    async inviteUserToTeam(@Arg("screeName", type => String) screenName: String, @Arg("teamId", type => Int) teamId: number): Promise<Membership> {
        const user = await this.userRepository.findOne({where: {screenName}});
        const team = await this.teamRepository.findOne(teamId);
        if(!user) {
            return Promise.reject('user not found');
        }
        if(!team) {
            return Promise.reject('team not found');
        }
        return this._joinTeam(user, team)
    }


}