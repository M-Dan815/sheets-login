const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const dbPath = path.resolve(__dirname, "../users.db");
const db = new sqlite3.Database(dbPath);

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
    return res.status(400).json({ error: "Invalid module" });
  }

  let query = "SELECT * FROM users WHERE 1=1";
  const params = [];

  if (city) {
    query += " AND city LIKE ?";
    params.push(`%${city}%`);
  }

  if (primary_languages) {
    query += " AND primary_languages LIKE ?";
    params.push(`%${primary_languages}%`);
  }

  if (search_key) {
    query +=
      " AND (full_name LIKE ? OR email LIKE ? OR primary_languages LIKE ?)";
    params.push(`%${search_key}%`, `%${search_key}%`, `%${search_key}%`);
  }

  if (order_by) {
    query += ` ORDER BY ${order_by} ${search_order.toUpperCase()}`;
  }

  const offset = (page - 1) * per_page;
  query += ` LIMIT ? OFFSET ?`;
  params.push(per_page, offset);

  // Count total for pagination
  const countQuery = query
    .replace("SELECT *", "SELECT COUNT(*) as total")
    .replace(/LIMIT.*$/, "");

  db.get(countQuery, params.slice(0, params.length - 2), (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    const total = row.total;
    const last_page = Math.ceil(total / per_page);

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      const mappedData = rows.map((item) => ({
        users__id: item.id,
        users__username: item.username,
        users__full_name: item.full_name,
        users__email: item.email,
        users__city: item.city,
        users__repo_count: item.repo_count,
        users__star_count: item.star_count,
        users__follower_count: item.follower_count,
        users__linkedin_url: item.linkedin_url,
        users__twitter_url: item.twitter_url,
        users__twitter_follower_count: item.twitter_follower_count,
        users__bio: item.bio,
        users__primary_languages: item.primary_languages,
        users__profile_readme: item.profile_readme,
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
