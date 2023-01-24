import { AlertBlock, LoadingPlaceholder } from 'genesys-react-components';

import { useRateLimited, useUserData } from '../../helpers/GenesysCloudAPI';
import OrgChart from './OrgChart';

import './OrgChartApp.scss';

interface IProps {}

export default function OrgChartApp(props: IProps) {
	const user = useUserData();
	const isRateLimited = useRateLimited();

	return (
		<div className="org-chart-app">
			{!user && <LoadingPlaceholder text="Checking authorization..." />}
			{user && (
				<div className="content">
					{isRateLimited && (
						<AlertBlock alertType="warning">
							<p>The app is currently being rate limited, please be patient while results are loading.</p>
						</AlertBlock>
					)}
					<OrgChart />
				</div>
			)}
		</div>
	);
}
