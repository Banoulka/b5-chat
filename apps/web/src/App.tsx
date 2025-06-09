import './index.css';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import reactLogo from './assets/logo.png';
import { Button } from './components/ui/button';
import { env } from './env';

const queryClient = new QueryClient();

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<QueryClientProvider client={queryClient}>
				<div>
					<a href="https://react.dev" target="_blank">
						<img src={reactLogo} className="logo react" alt="React logo" />
					</a>
				</div>
				<h1 className="text-3xl font-bold text-red-500 underline">Vite + React</h1>
				<div className="card">
					<Button variant="outline" onClick={() => setCount((count) => count + 1)}>
						Click me ({count})
					</Button>
					<p>
						Edit <code>src/App.tsx</code> and save to test HMR
					</p>
				</div>
				<p>{env.VITE_API_URL}</p>
				<p className="read-the-docs">Click on the Vite and React logos to learn more</p>
				<TestQuery />
			</QueryClientProvider>
		</>
	);
}

const TestQuery = () => {
	const { data, isLoading, error } = useQuery({
		queryFn: () => fetch(`${env.VITE_API_URL}/test/1234`).then((res) => res.json()),
		queryKey: ['test'],
	});

	if (isLoading) return <div>Loading...</div>;

	if (error) return <div>Error: {error.message}</div>;

	return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

export default App;
