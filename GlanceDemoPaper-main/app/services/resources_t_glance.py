def to_json_structure(root_node, numeric_features=[]):
    """
    Converts the tree structure to a JSON-like nested dictionary for visualization.

    Parameters:
    ----------
    root_node : Node
        The root node of the tree to start the JSON structure creation.
    numeric_features : list
        A list of numeric feature names used for processing node labels.

    Returns:
    -------
    dict
        A JSON-like dictionary representing the tree structure.
    """
    
    def assign_ids(node, node_id=0):
        """Recursively assigns unique IDs to each node."""
        node.id = node_id
        next_id = node_id + 1
        for child in node.children.values():
            next_id = assign_ids(child, next_id)
        return next_id

    # Ensure every node has an id
    assign_ids(root_node)

    # Prepare node labels and values
    def prepare_labels(node):
        max_value = 0
        max_list = None

        for value, child_node in node.children.items():
            if node.split_feature in numeric_features:
                if max(value) > max_value:
                    max_value = max(value)
                    max_list = child_node

        for value, child_node in node.children.items():
            if node.split_feature in numeric_features and child_node != max_list:
                val = max(value)
        
        for value, child_node in node.children.items():
            child_node.data_feat = node.split_feature
            if node.split_feature in numeric_features:
                if child_node == max_list:
                    child_node.data_val = f"> {val}"
                else:
                    child_node.data_val = f"<= {val}"
            else:
                child_node.data_val = value if len(value) > 1 else value[0]
            prepare_labels(child_node)
    
    prepare_labels(root_node)
    root_node.data_feat = "all"
    root_node.data_val = "-"

    # Recursive function to build JSON for each node
    def build_json_node(node):
        """Builds a JSON-like structure for the given node."""
        size = node.size
        num_flipped = node.effectiveness
        cost_sum = node.cost
        eff = num_flipped / size if size != 0 else 0

        actions = [action[action != "-"].to_dict() for action in node.actions]
        actions_ = [{k: round(v, 3) if k in numeric_features else v for k, v in action.items()} for action in actions]

        cost = cost_sum / num_flipped if num_flipped != 0 else 0

        # Build node data as a dictionary
        node_data = {
            "id": node.id,
            "effectiveness": int(round(eff,2)),
            "cost": int(round(cost,2)),
            "size": int(size),
            "actions": actions_,
            "split_feature": node.split_feature,
            "data_val": node.data_val,
            "children": [build_json_node(child) for child in node.children.values()]
        }
        
        return node_data

    # Build JSON structure from the root node
    return build_json_node(root_node)
