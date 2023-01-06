import React from 'react';

import { User } from '../../helpers/GenesysCloudAPITypes';

import './UserCard.scss';

interface IProps {
	user: User;
	onClick?: { (): void };
}

export default function UserCard(props: IProps) {
	let imageUrl;
	if (props.user.images && props.user.images.length > 0) {
		imageUrl = props.user.images[0].imageUri;
	}
	return (
		<div
			className={`user-card${props.onClick ? ' clickable' : ''}`}
			onClick={(e) => {
				if (props.onClick) {
					e.preventDefault();
					e.stopPropagation();
					props.onClick();
				}
			}}
		>
			{imageUrl && <img className="user-image" src={imageUrl} alt="profile" />}
			<div className="user-info">
				<span className="name">{props.user.name}</span>
				<span className="title">{props.user.title}</span>
				<span className="department">{props.user.department}</span>
			</div>
		</div>
	);
}
