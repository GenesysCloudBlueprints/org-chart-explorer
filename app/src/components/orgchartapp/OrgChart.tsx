import React, { useState } from 'react';
import { GenesysDevIcons } from 'genesys-dev-icons';
import { DxTextbox } from 'genesys-react-components';

import GenesysCloudAPI from '../../helpers/GenesysCloudAPI';
import { User } from '../../helpers/GenesysCloudAPITypes';
import UserCard from '../usercard/UserCard';

import './OrgChart.scss';
import OrgChartMember from './OrgChartMember';

export interface IProps {
	api: GenesysCloudAPI;
}

export default function OrgChart(props: IProps) {
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [searchResults, setSearchResults] = useState<User[]>();
	const [targetUser, setTargetUser] = useState<User | undefined>(props.api.me);

	const chooseUser = (user?: User) => {
		setTargetUser(user);
		setSearchResults(undefined);
		setSearchTerm('');
	};

	return (
		<div className="org-chart">
			<div className="controls">
				<div className="user-me">
					<p>Welcome {props.api.me?.name || props.api.me?.id || 'Unknown User'}! Click your card to recenter the chart on you.</p>
					{props.api.me && <UserCard user={props.api.me} onClick={() => chooseUser(props.api.me)} />}
				</div>
				<div className={`user-search${searchResults ? ' results-open' : ''}`}>
					<DxTextbox
						value={searchTerm}
						label="Search for a user by name"
						className="search-input"
						icon={GenesysDevIcons.AppSearch}
						clearButton={true}
						changeDebounceMs={700}
						onChange={(value: string) => {
							setSearchTerm(value);
							// Clear search results
							setSearchResults(undefined);

							if (!value || value.length < 3) return;

							// Execute search
							props.api
								.SearchUsers(value)
								.then((data) => {
									console.log(data);
									setSearchResults(data?.results || []);
								})
								.catch(console.error);
						}}
					/>
					{searchResults && (
						<div className="search-results">
							{searchResults.length > 0 &&
								searchResults.map((user) => (
									<UserCard
										key={user.id}
										user={user}
										onClick={() => {
											console.log('click!');
											// setTargetUser(user);
											// setSearchResults(undefined);
											// setSearchTerm('');
											chooseUser(user);
										}}
									/>
								))}
							{searchResults.length === 0 && <em>No users found</em>}
						</div>
					)}
				</div>
			</div>
			<div className="chart">
				<h2>Org Chart</h2>
				{targetUser && <OrgChartMember api={props.api} user={targetUser} onClick={(user) => setTargetUser(user)} />}
			</div>
		</div>
	);
}
