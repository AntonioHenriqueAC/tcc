function submitar() {
	setTimeout(() => {
		document.forms['uploadForm'].submit()
	}, 3500);
} 

$(document).ready(function () {
	$(".buttonUpload a span").click(function () {
		var btn = $(this).parent().parent();
		var loadSVG = btn.children("a").children(".load");
		var loadBar = btn.children("div").children("span");
		var checkSVG = btn.children("a").children(".check");

		btn
			.children("a")
			.children("span")
			.fadeOut(200, function () {
				btn.children("a").animate({
						width: 56
					},
					100,
					function () {
						loadSVG.fadeIn(300);
						btn.animate({
								width: 320
							},
							200,
							function () {
								btn.children("div").fadeIn(200, function () {
									loadBar.animate({
											width: "100%"
										},
										2000,
										function () {
											loadSVG.fadeOut(200, function () {
												checkSVG.fadeIn(200, function () {
													setTimeout(function () {
														btn.children("div").fadeOut(200, function () {
															loadBar.width(0);
															checkSVG.fadeOut(200, function () {
																btn.children("a").animate({
																	width: 150
																});
																btn.animate({
																		width: 150
																	},
																	300,
																	function () {
																		btn
																			.children("a")
																			.children("span")
																			.fadeIn(200);
																	}
																);
															});
														});
													}, 2000);
												});
											});
										}
									);
								});
							}
						);
					}
				);
			});
	});
});



function readURL(input) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			$('.image-upload-wrap').hide();

			$('.file-upload-image').attr('src', e.target.result);
			$('.file-upload-content').show();

			$('.image-title').html(input.files[0].name);
		};
		reader.readAsDataURL(input.files[0]);
	} else {
		removeUpload();
	}
}

function removeUpload() {
	$('.file-upload-input').replaceWith($('.file-upload-input').clone());
	$('.file-upload-content').hide();
	$('.image-upload-wrap').show();
}
$('.image-upload-wrap').bind('dragover', function () {
	$('.image-upload-wrap').addClass('image-dropping');
});
$('.image-upload-wrap').bind('dragleave', function () {
	$('.image-upload-wrap').removeClass('image-dropping');
});


function getId() {
	addEventListener('click', function (ev) {
		var ident = ev.target.id;
		if (ev.target.name === 'list') {
			document.getElementById("myIdList").value = ident;
			document.getElementById('list').submit()
		} else {
			document.getElementById("myIdDelete").value = ident;
			document.getElementById('delete').submit()
		}
	})
}