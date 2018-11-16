import {BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";

@Entity()
export class PasswordResetToken {

    @PrimaryGeneratedColumn()
    id;

    @OneToOne(type => User, {eager: true})
    @JoinColumn()
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    resetToken: string;

    @BeforeInsert()
    public genToken() {
        this.resetToken = Math.random().toString(36).substring(2)
    }
}