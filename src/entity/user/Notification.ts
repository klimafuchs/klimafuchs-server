import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Field, Int, ObjectType, registerEnumType} from "type-graphql";
import {User} from "./User";
import {TeamResolverErrors} from "../../resolver/TeamResolver";

enum NotificationIcon {
    CHALLENGE = 'md-group',
    TEAM = 'md-person',
    FEED = 'list',
    OTHER = 'md-notifications-outline'
}

registerEnumType(NotificationIcon, {
    name: 'NotificationIcon',
    description: 'Sets icons on notifications for notifications view'
});

@Entity()
@ObjectType()
export class Notification {
    @PrimaryGeneratedColumn()
    @Field(type => Int)
    id: number;

    @ManyToOne(type => User, user => user.notifications)
    @Field(type => User)
    user: Promise<User>;

    @Column()
    @Field(type => String)
    title: string;

    @Column()
    @Field(type => String)
    body: string;

    @Column()
    @Field(type => String)
    icon: NotificationIcon;

    @Column()
    @Field(type => String)
    status: 'delivered'|'sent'|'pending'|'failed';

    @Column()
    @Field(type => Int)
    ticketId: string;
}