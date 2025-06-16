import React from "react";

export function getSubmitButton(os: 'windows' | 'macos' | 'linux' | 'unknown') {
	if (os === 'macos') {
		return (
			<span className="flex items-center gap-1">
				<span>Submit ⌘↵</span>
			</span>
		);
	} else if (os === 'windows') {
		return (
			<span className="flex items-center gap-1">
				<span>Submit Ctrl+↵</span>
			</span>
		);
	} else {
		return (
			<>
				<span className="hidden sm:inline">Submit</span>
				<span className="sm:hidden">Send</span>
			</>
		);
	}
}


