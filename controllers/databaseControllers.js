const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const dbPath = path.resolve(__dirname, "../users.db");
const db = new sqlite3.Database(dbPath);

// Helper function to parse comma-separated values
const parseMultipleValues = (value) => {
	if (!value) return [];
	return value
		.split(",")
		.map((v) => v.trim())
		.filter((v) => v.length > 0);
};

exports.search = (req, res) => {
	const {
		module_id,
		search_key,
		"1__primary_languages": primary_languages,
		"1__city": city,
		page = 1,
		per_page = 10,
		order_by,
		search_order = "asc",
		text_search_type,
	} = req.body;

	if (module_id !== 1) {
		return res.status(400).json({error: "Invalid module"});
	}

	let query = "SELECT * FROM users WHERE 1=1";
	const params = [];

	// Parse comma-separated values
	const cities = parseMultipleValues(city);
	const languages = parseMultipleValues(primary_languages);
	const searchKeys = parseMultipleValues(search_key);

	// Handle multiple cities (AND logic - must match ALL cities)
	if (cities.length > 0) {
		cities.forEach((c) => {
			query += " AND city LIKE ?";
			params.push(`%${c}%`);
		});
	}

	// Handle multiple languages (AND logic - must have ALL languages)
	if (languages.length > 0) {
		languages.forEach((lang) => {
			query += " AND primary_languages LIKE ?";
			params.push(`%${lang}%`);
		});
	}

	// Handle multiple search keys (AND logic - must match ALL terms)
	// Searches across full_name, public_email, primary_languages, bio, and profile_readme
	if (searchKeys.length > 0) {
		searchKeys.forEach((key) => {
			query +=
				" AND (full_name LIKE ? OR public_email LIKE ? OR primary_languages LIKE ? OR bio LIKE ? OR profile_readme LIKE ?)";
			params.push(`%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`);
		});
	}

	if (order_by) {
		const validColumns = [
			"follower_count",
			"following_count",
			"star_count",
			"repo_count",
			"twitter_follower_count",
		];
		if (validColumns.includes(order_by)) {
			const direction = search_order.toUpperCase() === "DESC" ? "DESC" : "ASC";
			query += ` ORDER BY ${order_by} ${direction}`;
		}
	}

	const offset = (page - 1) * per_page;
	query += ` LIMIT ? OFFSET ?`;
	params.push(per_page, offset);

	// Build count query with same conditions (without LIMIT/OFFSET)
	let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1";
	const countParams = [];

	if (cities.length > 0) {
		cities.forEach((c) => {
			countQuery += " AND city LIKE ?";
			countParams.push(`%${c}%`);
		});
	}

	if (languages.length > 0) {
		languages.forEach((lang) => {
			countQuery += " AND primary_languages LIKE ?";
			countParams.push(`%${lang}%`);
		});
	}

	if (searchKeys.length > 0) {
		searchKeys.forEach((key) => {
			countQuery +=
				" AND (full_name LIKE ? OR public_email LIKE ? OR primary_languages LIKE ? OR bio LIKE ? OR profile_readme LIKE ?)";
			countParams.push(
				`%${key}%`,
				`%${key}%`,
				`%${key}%`,
				`%${key}%`,
				`%${key}%`,
			);
		});
	}

	db.get(countQuery, countParams, (err, row) => {
		if (err) {
			console.error("Count query error:", err);
			return res.status(500).json({error: "Database error"});
		}
		const total = row.total;
		const last_page = Math.ceil(total / per_page) || 1;

		db.all(query, params, (err, rows) => {
			if (err) {
				console.error("Search query error:", err);
				return res.status(500).json({error: "Database error"});
			}

			const mappedData = rows.map((item) => ({
				users__id: item.id,
				users__username: item.username,
				users__full_name: item.full_name,
				users__public_email: item.public_email,
				users__city: item.city,
				users__bio: item.bio,
				users__repo_count: item.repo_count,
				users__star_count: item.star_count,
				users__follower_count: item.follower_count,
				users__following_count: item.following_count,
				users__linkedin_url: item.linkedin_url,
				users__twitter_url: item.twitter_url,
				users__twitter_follower_count: item.twitter_follower_count,
				users__primary_languages: item.primary_languages,
				users__profile_readme: item.profile_readme,
				users__github_created_at: item.github_created_at,
			}));

			res.json({
				current_page: page,
				data: mappedData,
				total,
				last_page,
			});
		});
	});
};
