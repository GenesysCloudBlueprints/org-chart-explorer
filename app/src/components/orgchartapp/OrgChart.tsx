import { useEffect, useState } from 'react';
import { GenesysDevIcon, GenesysDevIcons } from 'genesys-dev-icons';
import { DxTextbox, LoadingPlaceholder } from 'genesys-react-components';
import { stringify } from 'csv-stringify/browser/esm/sync';

import { clearSubReports, useGenesysCloudAPI, useSubReports, useUserData } from '../../helpers/GenesysCloudAPI';
import { User } from '../../helpers/GenesysCloudAPITypes';
import UserCard from '../usercard/UserCard';

import './OrgChart.scss';
import OrgChartMember from './OrgChartMember';

export interface IProps {}

export default function OrgChart(props: IProps) {
	const api = useGenesysCloudAPI();
	const user = useUserData();
	const [searchTerm, setSearchTerm] = useState<string>('');
	const [searchResults, setSearchResults] = useState<User[]>();
	const [targetUser, setTargetUser] = useState<User | undefined>(user);
	const [superiors, setSuperiors] = useState<User[] | undefined>();
	const subReports = useSubReports();

	const chooseUser = async (user?: User) => {
		setTargetUser(user);
		setSearchResults(undefined);
		setSearchTerm('');
		setSuperiors(undefined);
		clearSubReports();
	};

	useEffect(() => {
		(async () => {
			if (api && targetUser && targetUser.id) {
				const res = await api.GetSuperiors(targetUser.id);
				setSuperiors(res?.reverse());
			}
		})();
	}, [api, targetUser]);

	if (!api) {
		return <LoadingPlaceholder />;
	}

	return (
		<div className="org-chart">
			<div className="controls">
				<div className="user-me">
					<p>Welcome {api.me?.name || api.me?.id || 'Unknown User'}! Click your card to recenter the chart on you.</p>
					{api.me && <UserCard user={api.me} onClick={() => chooseUser(api.me)} />}
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
							api
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
				{superiors &&
					superiors.map((user) => (
						<div>
							<OrgChartMember user={user} noChildren={true} onClick={(user) => chooseUser(user)} />
							<GenesysDevIcon icon={GenesysDevIcons.AppChevronUp} className="manager-icon" />
						</div>
					))}
				{targetUser && <OrgChartMember user={targetUser} onClick={(user) => chooseUser(user)} className="target-user" />}
				<h2>Sub-report list</h2>
				<pre>
					<code>{toCSV(subReports)}</code>
				</pre>
			</div>
		</div>
	);
}

function toCSV(users: User[]) {
	const data = users.map((user) => [user.name, user.department, user.title, user.email]);
	data.unshift(['Name', 'Department', 'Title', 'Email']);
	return stringify(data);
}
