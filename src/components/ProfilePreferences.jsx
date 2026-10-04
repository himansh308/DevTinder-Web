function ProfilePreferences() {
    // TODO: useSelector to read `user` from Redux
    // TODO: useState for genderPreference (array), minAge, maxAge, maxDistance
    // TODO: useEffect to sync state from `user` once it's available

    return (
        <div className="flex justify-center mt-10">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Feed Preferences</h2>

                    <label className="label">Interested In</label>
                    <div className="flex flex-col gap-2">
                        <label className="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                // TODO: checked={genderPreference.includes("male")}
                                // TODO: onChange to toggle "male" in genderPreference array
                            />
                            Male
                        </label>
                        <label className="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                // TODO: checked={genderPreference.includes("female")}
                                // TODO: onChange to toggle "female" in genderPreference array
                            />
                            Female
                        </label>
                        <label className="label cursor-pointer justify-start gap-2">
                            <input
                                type="checkbox"
                                className="checkbox"
                                // TODO: checked={genderPreference.includes("others")}
                                // TODO: onChange to toggle "others" in genderPreference array
                            />
                            Others
                        </label>
                    </div>

                    <label className="label">Age Range</label>
                    <div className="flex gap-4">
                        <input
                            type="number"
                            placeholder="Min Age"
                            className="input input-bordered w-full"
                            // TODO: value={minAge} onChange={...}
                        />
                        <input
                            type="number"
                            placeholder="Max Age"
                            className="input input-bordered w-full"
                            // TODO: value={maxAge} onChange={...}
                        />
                    </div>

                    <label className="label">Max Distance (km)</label>
                    <input
                        type="number"
                        placeholder="Max Distance"
                        className="input input-bordered w-full"
                        // TODO: value={maxDistance} onChange={...}
                    />

                    {/* TODO: error message display, same pattern as EditProfile */}

                    <div className="card-actions justify-center py-4">
                        <button
                            className="btn btn-primary"
                            // TODO: onClick handler to PATCH /profile/preferences
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>

            {/* TODO: success toast, same pattern as Navbar's delete-account toast */}
        </div>
    );
}

export default ProfilePreferences;
